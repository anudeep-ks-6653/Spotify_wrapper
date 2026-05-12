package com.spotify.wrapper.exception;

public class SpotifyApiException extends RuntimeException {
    private final int statusCode;
    private final String responseBody;

    public SpotifyApiException(int statusCode, String message, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
