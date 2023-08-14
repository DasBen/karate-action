Feature: Sanity Check
  Background:
    * url baseUrl

  Scenario: Abfrage des Health-Endpunktes
    Given path '/404'
    And header Content-Type = 'application/json'
    And header Authorization = authorization
    And header x-user_type = 'application'
    And header x-request-id = 'sanityTestOnDeployment'
    When method get
    Then status 200
