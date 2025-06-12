import type {
    CreatePrinterResponse,
    GetBuilderOptionsResponse,
    GetPrintersResponse,
    GetPrinterStatusesResponse
} from "@printweave/api-types";
import axios, {AxiosError} from 'axios';


export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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

// Connect to websocket server using WebSocket API
export interface WebSocketConnection {
    ws: WebSocket;
    token: string;
}

export interface WebSocketMessage {
    type: string;
    data: any;
}

export interface WebSocketEvent {
    type: string;
    data: any;
}

export interface WebSocketError {
    type: 'error';
    message: string;
}



// API helper function for making requests
async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    token?: string
): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = token;
    } else if (localStorage.getItem('auth_token')) {
        headers['Authorization'] = localStorage.getItem('auth_token') || '';
    }

    try {
        const response = await axios({
            method,
            url,
            headers,
            withCredentials: true,
            data: data,
        })

        return {
            data: response.data,
            status: response.status
        };
    } catch (error: any | AxiosError) {
        if (axios.isAxiosError(error)) {
            // Handle Axios error
            if (error.response) {
                // The request was made and the server responded with a status code
                return {
                    error: error.response.data.message || 'Request failed',
                    status: error.response.status,
                };
            } else if (error.request) {
                // The request was made but no response was received
                return {
                    error: 'No response received from server',
                    status: 500,
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                return {
                    error: error.message,
                    status: 500,
                };
            }
        }
        // Handle generic error
        return {
            error: (error as Error).message || 'An unexpected error occurred',
            status: 500,
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

export async function getPrinterStatuses(): Promise<ApiResponse<GetPrinterStatusesResponse>> {
    return apiRequest<GetPrinterStatusesResponse>('/api/printer/statuses', 'GET', undefined);
}

export async function getPrinter(id: string): Promise<ApiResponse<Printer>> {
    return apiRequest<Printer>(`/api/printer/${id}`, 'GET', undefined);
}

export async function addPrinter(printerData: Partial<Printer>): Promise<ApiResponse<CreatePrinterResponse>> {
    return apiRequest<CreatePrinterResponse>('/api/printer', 'POST', printerData);
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

// Temperature and fan control functions
export async function setHotendTemperature(printerId: string, component: string, temperature: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/temperature`, 'POST', {
        component: component,
        temperature: Math.round(temperature)
    });
}

export async function setBedTemperature(printerId: string, temperature: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/temperature`, 'POST', {
        component: 'bed',
        temperature: Math.round(temperature)
    });
}

export async function setFanSpeedApi(printerId: string, fanType: string, speed: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/fan`, 'POST', {
        fan: fanType,
        speed: Math.round(Number(speed))
    });
}

export async function moveAxis(printerId: string, axis: string, distance: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/move`, 'POST', {
        axis,
        distance: Math.round(distance * 10) / 10
    });
}

export async function homeAxes(printerId: string, axes: string[]): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/home`, 'POST', {
        axes
    });
}

export async function extrudeFilament(printerId: string, amount: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/api/printer/${printerId}/extrude`, 'POST', {
        amount: Math.round(amount)
    });
}

export async function getBuilderOptions(): Promise<ApiResponse<GetBuilderOptionsResponse>> {
    return apiRequest<GetBuilderOptionsResponse>('/api/printer/options', 'GET', undefined);
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
export async function createWebSocketConnection(token: string): Promise<WebSocket> {
    // Create a new WebSocket connection to the server and send the token as a message
    const ws = new WebSocket(`${WS_URL}`);

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };
    return new Promise((resolve, reject) => {
        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({ type: 'authenticate', token }));
        };
        ws.onmessage = (event) => {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (message.type === 'authenticated') {
                console.log('WebSocket authenticated:', message.data);
                resolve(ws);
            } else if (message.type === 'error') {
                console.error('WebSocket error:', message.data);
                reject(new Error(message.data));
            } else {
                console.log('WebSocket message:', message);
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            reject(error);
        };
    });
}
