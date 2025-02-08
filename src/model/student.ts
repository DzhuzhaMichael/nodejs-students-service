import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Student {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  surname!: string;

  @Property()
  birthDate!: Date;

  @Property()
  email!: string;

  @Property()
  phone!: string;
}
