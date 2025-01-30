import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';
import { BasePrinter } from './printers/base.printer.model.js';
import BambuPrinter from './printers/bambu.printer.model.js';

@Table({
  tableName: 'printers',
  timestamps: true
})
export class Printer extends Model {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.ENUM('bambu', 'other'),
    allowNull: false
  })
  type: 'bambu' | 'other';

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  active: boolean;

  @HasOne(() => BambuPrinter)
  bambuPrinter: BambuPrinter;

  async getPrinter(): Promise<BasePrinter> {
    switch (this.type) {
      case 'bambu':
        return BambuPrinter.findOne({ where: { printerId: this.id } });
      default:
        return null;
    }
  }
}

export default Printer;