import {
    BelongsToManyGetAssociationsMixin,
    DataTypes,
    HasManyAddAssociationMixin,
    HasManyGetAssociationsMixin, HasManyRemoveAssociationMixin,
    Model,
    Optional
} from "sequelize";
import db from "../config/database.config";
import {Printer} from "./printer.model";
import {UserPrinter} from "./userprinter.model";

interface UserAttributes {
    id: number;
    username: string;
    password: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

interface UserAssociations {
    getPrinters: HasManyGetAssociationsMixin<Printer>;
    addPrinter: HasManyAddAssociationMixin<Printer, number>;
}

export class User extends Model<UserAttributes, UserCreationAttributes> {
    declare id: number;
    username!: string;
    password!: string;
    email!: string;
    role!: 'user' | 'admin';
    active!: boolean;

    declare getPrinters: HasManyGetAssociationsMixin<Printer>;
    declare addPrinter: HasManyAddAssociationMixin<Printer, number>;
    declare removePrinter: HasManyRemoveAssociationMixin<Printer, number>

    test() {
        console.log('test');
    }

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

Printer.belongsToMany(User, { through: UserPrinter, foreignKey: 'printerId' });
User.belongsToMany(Printer, { through: UserPrinter });
User.hasMany(UserPrinter, { foreignKey: 'userId' });
