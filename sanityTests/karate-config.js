function fn() {
    console.log('Reading karate.properties: ' + JSON.stringify(karate.properties));

    const config = {
        baseUrl: karate.properties['baseUrl'] || 'http://localhost:8080',
        authorization: karate.properties['Authorization']
    };

    console.log('Config with passed Arguments: ' + JSON.stringify(config))

    return config;
}
