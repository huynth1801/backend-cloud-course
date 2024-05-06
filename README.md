- Install dependencies.

```
npm install
```

- Verify the Database configuration in `config/config.json`.
- Create DB using Sequelize.

```
npx sequelize-cli db:create
```

- Run migrations on the main database.

```
npx sequelize-cli db:migrate
```

- Start the application.

```
npm start
```

- Perform API requests.

## APIs

### HTTP Headers

- For APIs other than `Signup` and `Authentication`, pass the `JWT Token` in the `Authorization` header of the request.

```
Authorization: Bearer <JWT Token>
```

### Register

- POST `/register`

```
{
    "username": "thuyhuynh",
    "password": "password123",
    "email": "thuyhuynh@hcmut.com",
    "domain": "hcmut.com"
}
```

### Login

- POST `/login`

```
{
    "username": "thuyhuynh",
    "password": "password123",
}
```
