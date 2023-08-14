// tests/utils.test.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadKarateJar, renameHighestVersion } = require('../utils');

// Mock modules
jest.mock('axios');
jest.mock('fs');
jest.mock('path');

describe('renameHighestVersion', () => {

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Mock path's join
    path.join.mockImplementation((...args) => args.join('/'));

  });

  it('should copy the highest versioned JAR when multiple versions exist and no karate.jar', () => {
    fs.readdirSync.mockReturnValue(['karate-1.0.0.jar', 'karate-1.1.0.jar', 'karate-0.9.0.jar']);
    fs.existsSync.mockReturnValue(false);

    renameHighestVersion('mockedDir');

    expect(fs.copyFileSync).toHaveBeenCalledWith('mockedDir/karate-1.1.0.jar', 'mockedDir/karate.jar');
  });

  it('should delete existing karate.jar and copy the highest versioned JAR when multiple versions exist', () => {
    fs.readdirSync.mockReturnValue(['karate-1.0.0.jar', 'karate-1.1.0.jar', 'karate-0.9.0.jar']);
    fs.existsSync.mockReturnValue(true);

    renameHighestVersion('mockedDir');

    expect(fs.unlinkSync).toHaveBeenCalledWith('mockedDir/karate.jar');
    expect(fs.copyFileSync).toHaveBeenCalledWith('mockedDir/karate-1.1.0.jar', 'mockedDir/karate.jar');
  });

  it('should do nothing when no versioned JAR files are found', () => {
    fs.readdirSync.mockReturnValue(['some-other-file.jar']);
    fs.existsSync.mockReturnValue(true);

    renameHighestVersion('mockedDir');

    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(fs.copyFileSync).not.toHaveBeenCalled();
  });

});

describe('downloadKarateJar', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Mock axios's get
    axios.get.mockResolvedValue({
      data: {
        pipe: jest.fn()
      }
    });

    // Mock fs's methods
    // Mock fs's methods
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]); // <-- This line is added to return an empty array
    fs.mkdirSync.mockReturnValue(undefined);
    fs.createWriteStream.mockReturnValue({
      on: jest.fn((event, callback) => callback())
    });
    fs.copyFileSync.mockReturnValue(undefined);

    // Mock path's join
    path.join.mockReturnValue('mockedPath/karate.jar');
  });

  it('should download karate jar successfully', async () => {
    await expect(downloadKarateJar('mockedVersion', 'mockedTestDir')).resolves.toBeUndefined();

    // Additional checks can be added, like if axios.get was called, fs.createWriteStream was called, etc.
    expect(axios.get).toHaveBeenCalled();
    expect(fs.createWriteStream).toHaveBeenCalled();
  });

  it('should not download if jar already exists', async () => {
    fs.existsSync.mockReturnValueOnce(true); // Mock that the versioned jar exists

    await expect(downloadKarateJar('mockedVersion', 'mockedTestDir')).resolves.toBeUndefined();

    // Ensure axios.get wasn't called, but the copying mechanism was invoked
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should throw an error for an invalid version', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 404 } });  // Mocking a 404 error

    await expect(downloadKarateJar('invalidVersion', 'mockedTestDir')).rejects.toThrow(`Karate version vinvalidVersion not found.`);
  });

  it('should throw a generic error for other issues during download', async () => {
    const genericError = new Error('Network error');
    axios.get.mockRejectedValueOnce(genericError);  // Mocking a non-404 error

    await expect(downloadKarateJar('mockedVersion', 'mockedTestDir')).rejects.toThrow('Network error');
  });

});
