CREATE TYPE "ActivityHourCategory" AS ENUM ('UNIVERSITY', 'FACULTY', 'FREE');

ALTER TABLE "activities"
ADD COLUMN "activity_hour_category" "ActivityHourCategory",
ADD COLUMN "activity_hours" DOUBLE PRECISION;
