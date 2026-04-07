-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_requestId_idx" ON "Order"("requestId");

-- CreateIndex
CREATE INDEX "Order_quotationId_idx" ON "Order"("quotationId");

-- CreateIndex
CREATE INDEX "Quotation_requestId_idx" ON "Quotation"("requestId");

-- CreateIndex
CREATE INDEX "Quotation_agentId_idx" ON "Quotation"("agentId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SourcingRequest_clientId_idx" ON "SourcingRequest"("clientId");

-- CreateIndex
CREATE INDEX "SourcingRequest_assignedAgentId_idx" ON "SourcingRequest"("assignedAgentId");
