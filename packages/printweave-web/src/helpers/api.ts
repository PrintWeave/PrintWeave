import type {GetPrintersResponse} from "@printweave/api-types";

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

import type {User, Printer, UserPrinter} from '@printweave/models';

// Auth interfaces
interface LoginRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

interface LoginResponse {
    message: string;
    token: string;
    raw: string;
}

interface RegisterRequest {
    username: string;
    password: string;
    email: string;
}

interface RegisterResponse {
    message: string;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
    status: number;
}

// API helper function for making requests
async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    token?: string
): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = token;
    } else if (localStorage.getItem('auth_token')) {
        headers['Authorization'] = localStorage.getItem('auth_token') || '';
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });

        const responseData = await response.json();

        if (response.status === 400 || response.status === 401 || response.status === 403) {
            return {
                error: responseData.message || 'Bad request',
                status: response.status
            };
        }

        return {
            data: responseData,
            status: response.status
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500
        };
    }
}

// Authentication functions
export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/login', 'POST', credentials);
}

export async function register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/register', 'POST', userData);
}

export async function getUser(): Promise<ApiResponse<User>> {
    return apiRequest<User>('/api/users/me', 'GET', undefined, localStorage.getItem('auth_token') || '');
}

// Printer functions
export async function getPrinters(): Promise<ApiResponse<GetPrintersResponse>> {
    return apiRequest<GetPrintersResponse>('/api/printer', 'GET', undefined);
}

export async function getPrinter(id: string): Promise<ApiResponse<Printer>> {
    return apiRequest<Printer>(`/api/printer/${id}`, 'GET', undefined);
}

export async function addPrinter(printerData: Partial<Printer>): Promise<ApiResponse<Printer>> {
    return apiRequest<Printer>('/api/printer', 'POST', printerData);
}

export async function updatePrinter(id: string, printerData: Partial<Printer>): Promise<ApiResponse<Printer>> {
    return apiRequest<Printer>(`/api/printer/${id}`, 'PUT', printerData);
}

export async function deletePrinter(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${id}`, 'DELETE', undefined);
}

// User printer functions
export async function getUserPrinters(): Promise<ApiResponse<UserPrinter[]>> {
    return apiRequest<UserPrinter[]>('/api/printer/user', 'GET', undefined);
}

export async function assignPrinter(userId: string, printerId: string): Promise<ApiResponse<UserPrinter>> {
    return apiRequest<UserPrinter>('/api/printer/assign', 'POST', {userId, printerId});
}

export async function unassignPrinter(userId: string, printerId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/api/printer/unassign', 'POST', {userId, printerId});
}

// Printer control functions
export async function startPrint(printerId: string, fileId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/start`, 'POST', {fileId});
}

export async function stopPrint(printerId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/stop`, 'POST', undefined);
}

export async function pausePrint(printerId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/pause`, 'POST', undefined);
}

export async function resumePrint(printerId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/resume`, 'POST', undefined);
}

// User management functions
export async function getUsers(): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>('/api/users', 'GET', undefined);
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
    return apiRequest<User>('/api/users/me', 'GET', undefined);
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest<User>(`/api/users/${userId}`, 'PUT', userData);
}

// WebSocket connection helper
export function createWebSocketConnection(token: string): WebSocket {
    const ws = new WebSocket(`${WS_URL}?token=${token.replace('Bearer ', '')}`);
    return ws;
}
