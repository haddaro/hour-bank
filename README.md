# hour-bank
(Deployed to render.com. Postman documentation: https://documenter.getpostman.com/view/30866950/2s9YeAAEaE)

Description:
Hour-Bank is an API for a unique bartering system that facilitates service exchanges between users. In this system, users can register as service providers in various categories. When a service is rendered, the provider earns a credit hour, which they can then use to "purchase" services from other registered users. This creates a dynamic, community-driven exchange network where services are traded on an hour-for-hour basis.

Key Features:
User Registration: Users can sign up as providers of different services.
Service Transactions: Users can "buy" and "sell" service hours.
Credit System: Earned credits can be used to avail services from other users.
Reviews: After a transaction, users can leave reviews for the service received.
Authentication & Authorization: Secure user authentication and authorization.
Atomic Transactions: Ensures the integrity of credit exchanges.
Error Handling: Emphasis on handling errors effectively for reliability.

Technology Stack:
Node.js: For building the backend application.
Express: Web application framework for Node.js.
MongoDB: NoSQL database for storing data.
Mongoose: MongoDB object modeling for Node.js.
