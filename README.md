# Karate GitHub Action

This action allows you to run Karate tests directly from your GitHub Actions workflow. It makes use of Karate's
standalone JAR to run `.feature` files against specified base URLs.

## Setup

1. Make sure you have a `.feature` file containing your Karate tests. For example, you could have a `SanityTest.feature`
   in a `sanityTests` directory at the root of your project.

2. If you're using a custom Karate configuration, ensure that you have a `karate-config.js` in the same directory as
   your `.feature` file.

3. Clone this repository or add it to your GitHub project to have access to the action.

## Usage

Here's a basic example of how to use the Karate action in your workflow:

```yaml
name: Run Karate Tests

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Java
        uses: actions/setup-java@v2
        with:
          distribution: 'azul'
          java-version: '17'

      - name: Run Karate tests
        uses: DasBen/karate-action@<release-version>
        with:
          karateVersion: '1.4.0'
          baseUrl: 'https://your-api-url.com'
          testDir: './sanityTests'
          testFilePath: 'SanityTest.feature,AnotherTest.feature'
          authToken: '123456789' # Optional
```

### Inputs

| Name            | Description                                  | Required | Default               |
|-----------------|----------------------------------------------|----------|-----------------------|
| `karateVersion` | The version of Karate standalone JAR to use. | Yes      | Must be provided      |
| `baseUrl`       | The base URL for your tests.                 | Yes      | http://localhost:8080 |
| `testDir`       | Path to your test directory.                 | Yes      | Must be provided      |
| `testFilePath`  | List of `.feature` files.                    | Yes      | Must be provided      |
| `authToken`     | Authorization header value if needed.        | No       | null                  |

```
