Feature: Sanity Check with Tags
  Background:
    * url baseUrl

  @success
  Scenario: Abfrage des Health-Endpunktes
    Given path '/200'
    And header Content-Type = 'application/json'
    And header Authorization = authorization
    And header x-user_type = 'application'
    And header x-request-id = 'sanityTestOnDeployment'
    When method get
    Then status 200

  @error
  Scenario: Abfrage des Health-Endpunktes
    Given path '/200'
    And header Content-Type = 'application/json'
    And header Authorization = authorization
    And header x-user_type = 'application'
    And header x-request-id = 'sanityTestOnDeployment'
    When method get
    Then status 201
