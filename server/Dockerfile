# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY go.mod go.sum ./
RUN go mod download

# Copy source code files
COPY . .

# Build standard statically linked Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# Run stage
FROM alpine:latest

# Install base dependencies (like timezone database and CA certificates)
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy built binary from builder stage
COPY --from=builder /app/main .

# Expose backend port
EXPOSE 8080

# Command to execute backend binary
CMD ["./main"]
