import {CreationOptional, DataTypes, InferAttributes, Model, Optional} from "sequelize";
import db from "../config/database.config";

interface UserAttributes {
    id: number;
    username: string;
    password: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
    declare id: number;
    username!: string;
    password!: string;
    email!: string;
    role!: 'user' | 'admin';
    active!: boolean;

    static async findById(id: string) {
        return User.findByPk(id);
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true
    },
    password: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize: db,
    modelName: 'users'
});
