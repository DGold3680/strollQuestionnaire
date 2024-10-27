Consider any potential improvements to enhance the product. Writeup: Provide a detailed explanation of your strategy, outlining the pros and cons of your design and implementation. Submission: Share a link to a GitHub/GitLab repository with your solution. The README.md file should contain the writeup. 

My strategy to solving this question was in 4 phase.
- Theorize a solution using a database schema and architecture that suits the problem question
In this step, i used my scratch book to draw up a database schema and describe the interactions that will see the problem solved. The basic but crucial formulas for cycling the questions and producing the appropriate question at the right time were figured out in this step. I ended up having a pseudo code implementation by this point.
- Implement the core functionality
I went ahead to create my nodejs/express/mongo/mongoose server. I created the database schema, connected the database and moved to focus on the fetch question route and seeded the database to test the implementation. After making sure it worked i went ahead to create other convince routes to interact with the db as well as a route for updating the region cycle duration as requested in the problem statement. Lastly I handled the cycling using agendas to schedule the change in c=active cycles
- optimize the application
With the basic setup, i went back to the scratch pad to figure out the best optimizations i could easily add to scale it. I choose redis for caching, and made sure to keep it updated as the cycles changed. I also added a rate limiter to prevent abuse of the service. I added an indexing to the question schema to help query it faster and used pre save and pre-update hooks to calculate activeCycle on cycle duration change. 
- Addons
With the core of the service complete and reasonable scalable, i proceeded to document the API, test the endpoints again, and test the core questionCycling endpoint with an integration test. Lastly i went over the folders and files to ensure consistency of best practices.

Pros of Implementation
- simple and easy to understand
- easily scalable
- good time zone management
- core functionality works
- well documented and tested

Cons
- Scalability could be increased, (at the cost of complexity)
- No use of container (docker) for consistent service delivery 
- security implementation could be stronger with helmetjs 
