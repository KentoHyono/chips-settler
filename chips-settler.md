# Chips Settler (v1)

A mobile‑responsive web app that helps poker players quickly calculate
who owes money to whom at the end of a home game.

Instead of manually doing math after a session, players enter their
final chip counts and the app automatically determines the profit/loss
for each player and generates settlements.

------------------------------------------------------------------------

## Features

### Core Features

-   Enter number of players
-   Input each player's:
    -   Name
    -   Final chips
    -   Extra buy‑ins (optional)
-   Input base buy‑in amount
-   Automatic profit/loss (PnL) calculation
-   Automatic settlement calculation (who pays whom)

### User Experience

-   Mobile‑responsive interface
-   Simple table‑based input layout
-   Fast calculations in the browser

### Sharing

-   Share results to social media
-   Copy results for group chats

### Session Storage

-   Save previous poker sessions
-   View past results in a history tab

------------------------------------------------------------------------

## Tech Stack

Frontend - TypeScript - HTML / CSS - Vite

Cloud / DevOps - AWS S3 (static hosting) - AWS CloudFront (CDN) - GitHub
(source control)

Future versions may include: - AWS Lambda - API Gateway - DynamoDB

------------------------------------------------------------------------

## How the Calculation Works

1.  Total pot is calculated from:

    -   Base buy‑ins
    -   Extra buy‑ins

2.  Each player's expected share is calculated.

3.  Profit and Loss (PnL) is determined:

    -   Positive PnL = player wins money
    -   Negative PnL = player owes money

4.  The app computes the minimal number of transactions needed to settle
    balances.

Example output:

Alice → +\$30\
Bob → -\$10\
Charlie → -\$20

Settlements:

Bob pays Alice \$10\
Charlie pays Alice \$20

Total PnL should equal **0** for normal in‑house poker games.

------------------------------------------------------------------------

## Running Locally

Install dependencies:

npm install

Run development server:

npm run dev

Build production version:

npm run build

The production build will be generated in the **dist/** folder.

------------------------------------------------------------------------

## Deployment (AWS)

1.  Run:

npm run build

2.  Upload the contents of **dist/** to an S3 bucket.

3.  Configure the bucket for static website hosting.

4.  Serve the site through CloudFront for CDN and HTTPS.

------------------------------------------------------------------------

## Future Improvements

-   Friend list / saved player profiles
-   Sharable link for simultaneous inputs
-   Backend session storage

------------------------------------------------------------------------

## License

MIT License
