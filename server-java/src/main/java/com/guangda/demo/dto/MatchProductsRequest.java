package com.guangda.demo.dto;

import jakarta.validation.constraints.NotNull;

public record MatchProductsRequest(@NotNull(message = "profile is required") DemandProfile profile) {
}
