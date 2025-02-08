import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Group {
  @PrimaryKey()
  id!: number; // `!` Гарантуємо, що id буде ініціалізований пізніше. 

  @Property()
  name!: string;

  @Property()
  curator!: string;
}
