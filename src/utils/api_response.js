class ApiResponse {
    constructor(success, message, data , statusCode) {
        this.statusCode = statusCode < 400
        this.success = success;
        this.message = message;
        this.data = data;
    }
}