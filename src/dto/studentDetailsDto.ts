export interface StudentDetailsDto {
    id: number;
    name: string;
    surname: string;
    birthDate: Date;
    email: string;
    phone: string;
    group?: {
      id: number;
      name: string;
      curator: string;
    };
  }
