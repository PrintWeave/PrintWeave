import {Table, Column, Model, DataType, ForeignKey, BelongsTo} from 'sequelize-typescript';
import {User} from './user.model.js';
import {Printer} from './printer.model.js';

@Table({
    tableName: 'user_printers',
    timestamps: true,
    modelName: 'userPrinter'
})
export class UserPrinter extends Model {
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare userId: number;

    @ForeignKey(() => Printer)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare printerId: number;

    @Column({
        type: DataType.ENUM('view', 'operate', 'admin'),
        allowNull: false
    })
    declare permission: 'view' | 'operate' | 'admin';
}

export default UserPrinter;
