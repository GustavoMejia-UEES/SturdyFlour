ALTER TABLE `profiles` ADD `email` text NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `password_hash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `name` text;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);