import { pgTableCreator } from "drizzle-orm/pg-core";

export const createTableWithPrefix = pgTableCreator(
  (name) => `habit-tracker_${name}`,
);
