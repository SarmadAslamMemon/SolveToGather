import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    address: text("address").notNull(),
    nic: text("nic").notNull().unique(),
    phoneNumber: text("phone_number").notNull(),
    role: text("role").notNull().default("normal_user"), // super_user, community_leader, normal_user
    communityId: varchar("community_id"),
    profileImage: text("profile_image"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const communities = pgTable("communities", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    location: text("location"),
    leaderId: varchar("leader_id"),
    memberCount: integer("member_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});
export const issues = pgTable("issues", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull(),
    image: text("image"),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    communityId: varchar("community_id").notNull(),
    authorId: varchar("author_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const campaigns = pgTable("campaigns", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull(),
    goal: decimal("goal", { precision: 12, scale: 2 }).notNull(),
    raised: decimal("raised", { precision: 12, scale: 2 }).default("0"),
    image: text("image"),
    daysLeft: integer("days_left").notNull(),
    communityId: varchar("community_id").notNull(),
    authorId: varchar("author_id").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
export const donations = pgTable("donations", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    campaignId: varchar("campaign_id").notNull(),
    donorId: varchar("donor_id"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text("payment_method").notNull(), // jazzcash, easypaisa, bank
    status: text("status").notNull().default("pending"), // pending, completed, failed
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const likes = pgTable("likes", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    issueId: varchar("issue_id").notNull(),
    userId: varchar("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const comments = pgTable("comments", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    issueId: varchar("issue_id").notNull(),
    userId: varchar("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
// Transaction History - Main transaction records (Firestore: transactionHistory)
export const transactionHistory = pgTable("transaction_history", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    transId: varchar("trans_id").notNull().unique(), // Transaction ID (same as id)
    campaignId: varchar("campaign_id").notNull(),
    requiredAmount: decimal("required_amount", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    transactionDetailId: varchar("transaction_detail_id").notNull(),
    status: text("status").notNull().default("pending"), // pending, verified, rejected
    communityId: varchar("community_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Transaction Details - Detailed transaction information (Firestore: transactionDetails)
export const transactionDetails = pgTable("transaction_details", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    transactionHistoryId: varchar("transaction_history_id").notNull(),
    senderName: text("sender_name").notNull(),
    senderId: varchar("sender_id").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    time: timestamp("time").notNull(),
    receiptImage: text("receipt_image").notNull(),
    isPaymentVerified: boolean("is_payment_verified").default(false),
    paymentMethod: text("payment_method").notNull(), // jazzcash, easypaisa, bank, raast
    communityId: varchar("community_id").notNull(),
    verifiedBy: varchar("verified_by"),
    verifiedAt: timestamp("verified_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
});
export const insertCommunitySchema = createInsertSchema(communities).omit({
    id: true,
    createdAt: true,
    memberCount: true,
});
export const insertIssueSchema = createInsertSchema(issues).omit({
    id: true,
    createdAt: true,
    likes: true,
    comments: true,
});
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
    id: true,
    createdAt: true,
    raised: true,
    isActive: true,
});
export const insertDonationSchema = createInsertSchema(donations).omit({
    id: true,
    createdAt: true,
    status: true,
});
export const insertLikeSchema = createInsertSchema(likes).omit({
    id: true,
    createdAt: true,
});
export const insertCommentSchema = createInsertSchema(comments).omit({
    id: true,
    createdAt: true,
});
export const insertTransactionHistorySchema = createInsertSchema(transactionHistory).omit({
    id: true,
    transId: true,
    createdAt: true,
    updatedAt: true,
});
export const insertTransactionDetailsSchema = createInsertSchema(transactionDetails).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=schema.js.map