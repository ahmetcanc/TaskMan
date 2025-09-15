FROM golang:1.25-alpine

RUN apk add --no-cache git bash curl

WORKDIR /app

# Setup Air
RUN go install github.com/air-verse/air@latest
ENV PATH=$PATH:/root/go/bin

# Download modüles
COPY go.mod go.sum ./
RUN go mod download

# Copy the all backend files
COPY . .

EXPOSE 8080

# start hot reload with air
CMD ["air"]
