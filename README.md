#Solution Process

My strategy to solving this question was in four phases.

- Theorize a Solution
I started by using my notebook to draw up a database schema and describe the interactions needed to solve the problem. The basic but crucial formulas for cycling the questions and producing the appropriate question at the right time were figured out in this step. Libraries (like day.js) as well as patterns and techniques that would aid in solving the problem were researched and selected at this stage too. I ended up with a pseudocode implementation by this point.

- Implementing the Core Functionality
I proceeded to create my Node.js/Express/Mongo/Mongoose server. I created the database schema, connected the database, and focused on the fetch question route. I also seeded the database to test the implementation. After confirming it worked, I created other convenience routes to interact with the database, as well as a route for updating the region cycle duration as required in the problem statement. Lastly, I handled the cycling using agendas to schedule the change in active cycles.

- Optimizing the Application
With the basic setup complete, I returned to the notebook to consider the best optimizations I could add to improve scalability. During this stage, I switched from moment.js to day.js due to day.js being lighter. I decided to add a validation layer for the request body to reduce stress on the database from malformed requests. I chose Redis for caching, ensuring to keep it updated as cycles changed. I also added a rate limiter to prevent abuse of the service. I added indexing to the question schema to help query it faster and used pre-save and pre-update hooks to calculate the active cycle when the cycle duration changes.

Completing the Application
With the core of the service complete and reasonably scalable, I documented the API, tested the endpoints again, and performed an integration test on the core question cycling endpoint. Finally, I reviewed the folders and files to ensure consistency with best practices.



---
### Pros of Implementation

Simple and easy to understand

Easily scalable

Good time zone management

Core functionality works

Well documented and tested


### Cons

Scalability could be increased (at the cost of complexity)

No use of containerization (Docker) for consistent service delivery; unfortunately, I encountered issues with my Linux subsystem.

Security implementation could be stronger

No load testing conducted 

---

Suggestions for Improving the Service

- Things I Could Do
Given more time, I would add a security layer with helmet.js, an administrative and auth system overlying access to routes, containerization with Docker, load testing, database sharding with MongoDB (since the application is heavily region-dependent), and Redis clustering to help scale horizontally.

- Things I Would Suggest to Add to the Service Description
I think the service could benefit from more automated control in sequencing questions so that relevant topics or seasonal topics are easily added to showcase while relevant, without any manual calculations and sequencing.


