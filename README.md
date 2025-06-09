Real-Time Interaction Module | Poll Session
Overview
The Real-Time Interaction Module is a web application that allows users to create and participate in polls in real-time. The application features an admin panel for creating polls and a user panel for joining and voting on active polls. The results are displayed live using bar and pie charts.

Features
Admin Panel:

Create a poll with a question and multiple options.
Set a duration for the poll.
Launch the poll and view live results.
User Panel:

Join an active poll using a session code.
Vote on available options.
View confirmation after voting.
Live Results:

Display results in real-time using bar and pie charts.
Show session history of previous polls.
Technologies Used
HTML
CSS
JavaScript
SVG for chart rendering
Getting Started
Prerequisites
A modern web browser (Chrome, Firefox, Safari, etc.)
A local server (optional, for testing)
Installation
Clone the repository:

bash
Run
Copy code
git clone https://github.com/yourusername/poll-session.git
cd poll-session
Open the index.html file in your web browser:

You can simply double-click the index.html file or serve it using a local server.
File Structure
Run
Copy code
poll-session/
│
├── index.html        # Main HTML file
├── styles.css        # CSS styles for the application
└── script.js         # JavaScript functionality for the application
Usage
Admin Panel:

Click on the "Admin" tab.
Enter a poll question and options.
Set the poll duration (between 10 to 300 seconds).
Click "Launch Poll" to start the poll.
User Panel:

Click on the "User " tab.
Enter the session code provided by the admin.
Click "Join" to participate in the poll.
Select an option and click "Submit Vote".
View Results:

Admins can view live results in the active poll section.
Users will see a confirmation message after voting.
Contributing
Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.

Acknowledgments
Thanks to the open-source community for providing resources and libraries that made this project possible.
