# Rest API Documentation
## _List of all endpoints:_

## POST /register
### Request:
- Body:
```json
{
    "username": "username",
    "email": "email",
    "password": "password",
}
```
### Response:
- (201 - Created)
```json
{
    "id": 1,
    "username": "username",
    "email": "email",
}
```
- (400 - Bad Request)
```json
{
    "message": "Username cannot be null"
}
OR
{
    "message": "Username is required"
}
OR
{
    "message": "Email cannot be null"
}
OR
{
    "message": "Email is required"
}
OR
{
    "message": "Password cannot be null"
}
OR
{
    "message": "Password is required"
}
OR
{
    "message": "Username already exists"
}
OR
{
    "message": "Email already exists"
}
OR
{
    "message": "Password must be between 8 and 32 characters"
}
```

## POST /login
### Request:
- Body:
```json
{
    "username": "username",
    "password": "password",
}
```
### Response:
- (200 - OK)
```json
{
  "access_token": "string"
}
```
- (400 - Bad Request)
```json
{
    "message": "Email and password is required"
}
```

## Global Error
- (500 - Internal Server Error)
```json
{
    "message": "Internal Server Error"
}
```
- (401 - Unauthorized)
```json
{
    "message": "Invalid email or password"
}
```
- (401 - Invalid Token)
```json
[
  {
    "message": "Invalid Token"
  }
]
```