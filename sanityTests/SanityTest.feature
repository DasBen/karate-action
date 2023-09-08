Feature: Sanity Check
  Background:
    * url baseUrl

  Scenario: Abfrage des Health-Endpunktes
    Given path '/200'
    And header x-user_type = 'application'
    And header Authorization = authorization
    And header x-request-id = 'sanityTestOnDeployment'
    When method get
    Then status 200
