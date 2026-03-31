package com.guangda.demo.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null ? "invalid param" : error.getDefaultMessage())
                .orElse("invalid param");
        return errorBody(message, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleConstraint(ConstraintViolationException ex, HttpServletRequest request) {
        return errorBody(ex.getMessage(), request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public Map<String, Object> handleStatus(ResponseStatusException ex, HttpServletRequest request) {
        return errorBody(ex.getReason() == null ? "request failed" : ex.getReason(), request);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneric(Exception ex, HttpServletRequest request) {
        return errorBody("internal server error", request);
    }

    private Map<String, Object> errorBody(String message, HttpServletRequest request) {
        Object traceId = request.getAttribute(TraceIdFilter.TRACE_ID_ATTR);
        return Map.of(
                "code", 1,
                "message", message,
                "data", Map.of(),
                "traceId", traceId == null ? "" : traceId.toString()
        );
    }
}
