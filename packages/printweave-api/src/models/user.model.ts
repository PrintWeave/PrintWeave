import {Table, Column, Model, DataType, BelongsToMany, BeforeCreate, BeforeUpdate} from 'sequelize-typescript';
import {Printer} from './printer.model.js';
import {UserPrinter} from './userprinter.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {IUser} from "@printweave/api-types";

@Table({
    tableName: 'users',
    timestamps: true
})
export class User extends Model implements IUser {
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false
    })
    declare username: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare password: string;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    })
    declare email: string;

    @Column({
        type: DataType.ENUM('user', 'admin'),
        defaultValue: 'user'
    })
    declare role: 'user' | 'admin';

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    declare active: boolean;

    @BelongsToMany(() => Printer, () => UserPrinter)
    printers: Printer[];

    @BeforeCreate
    @BeforeUpdate
    static async hashPassword(instance: User) {
        if (instance.changed('password')) {
            console.log('Hashing password');
            instance.dataValues.password = await bcrypt.hash(instance.dataValues.password, 10);
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.dataValues.password);
    }

    generateToken(): string {
        return jwt.sign(
            {id: this.id, username: this.username, role: this.role},
            process.env.JWT_SECRET || 'your-secret-key',
            {expiresIn: '24h'}
        );
    }
}

export default User;
