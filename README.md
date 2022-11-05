# DotInsights

## Authentication Concept
Here is the main concept of authentication for DotInsights.
```mermaid
sequenceDiagram
    alt Wallet Is Not Connected
        User->>+DotInsightsFE: Connect Wallet
        DotInsightsFE->>-User: Open Select Wallet Popup
        User->>+DotInsightsFE: Select Wallet
        DotInsightsFE->>DotInsightsFE: Save Selected Wallet
        DotInsightsFE->>+Wallet: Request Connect Wallet
        Wallet->>-DotInsightsFE: Accept Connect
        DotInsightsFE->>+Wallet: Get Address List
        Wallet->>-DotInsightsFE: Return Address List
        DotInsightsFE->>DotInsightsFE: Save Addresss[0] as Selected Address
        DotInsightsFE->>-User: Open Select Address Popup
        User->>+DotInsightsFE: Select Address
        DotInsightsFE->>DotInsightsFE: Save Selected Address
    else Wallet Is Connected
        DotInsightsFE->>+Wallet: Request Connect Wallet
        Wallet->>-DotInsightsFE: Accept Connect (Auto if DApp In Authorized List)
    end
    DotInsightsFE->>-User: Show Wallet + Selected Address
```

## Voting Concept
Here is the main concept of voting for DotInsights.
```mermaid
sequenceDiagram
    alt User Is Not Authenticated
        User->>+DotInsightsFE: Authenticate
        DotInsightsFE->>-User: Authenticate Successfully
        DotInsightsFE->>+DotInsightsBE: Request Vote Message For Selected Address
        DotInsightsBE->>-DotInsightsFE: Response Vote Message
        DotInsightsFE->>DotInsightsFE: Save Vote Message With Selected Address
    end
    User->>+DotInsightsFE: Vote
    DotInsightsFE->>+Wallet: Request Signature For "[Vote Message]-[Project ID]"
    Wallet->>-DotInsightsFE: Response Signature
    DotInsightsFE->>+DotInsightsBE: Send Vote With Signature
    DotInsightsBE->>DotInsightsBE: Validate Sinature
    DotInsightsBE->>-DotInsightsFE: Reponse Vote Result
    DotInsightsFE->>-User: Show Vote Result
```

## New Project Concept
Here is the main concept of voting for DotInsights.
```mermaid
flowchart LR
    subgraph Google Form
    a1(Apply Google Form)-->a2{Approve}
    end
    a2 --true--> b1
    a2 --false--> a3(Stop)
    subgraph Notion
    b1(Create New Record)
    end
    b1 -.-> c1
    subgraph DotInsightBE
    c1(Interval synchronize)
    end
```
