function fn() {
    const config = {
        baseUrl: karate.properties['baseUrl'] || 'http://localhost:8080',
        authorization: karate.properties['Authorization']
    };

    console.log('Config with passed Arguments: ' + JSON.stringify(config))

    return config;
}
