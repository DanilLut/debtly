export interface Person {
  id: string;
  name: string;
}

export type DebtStatus = "given" | "payed back" | "borrowed" | "returned";

export interface Debt {
  id: string;
  personId: string;
  amount: number;
  description: string;
  date: string; // Date when the debt was created
  expectedReturnDate?: string; // Optional expected return date
  status: DebtStatus;
}
