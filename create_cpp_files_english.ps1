# C++ Standards Topics - English only to avoid encoding issues
$cppTopics = @(
    "C++ Naming Conventions",
    "C++ Indentation and Formatting",
    "C++ Commenting Standards",
    "C++ Function Design Guidelines",
    "C++ Class Design Principles",
    "C++ Exception Handling Best Practices",
    "C++ Memory Management Standards",
    "C++ Template Usage Guidelines",
    "C++ STL Usage Standards",
    "C++ Namespace Usage Rules",
    "C++ Constants and Macros Standards",
    "C++ Header File Inclusion Rules",
    "C++ Preprocessor Directive Standards",
    "C++ Type Conversion Guidelines",
    "C++ Operator Overloading Rules",
    "C++ Smart Pointer Usage Standards",
    "C++ Thread Safety Guidelines",
    "C++ Performance Optimization Standards",
    "C++ Code Review Guidelines",
    "C++ Unit Testing Standards",
    "C++ Error Handling Best Practices",
    "C++ Cross-Platform Compatibility Rules",
    "C++ Code Documentation Standards",
    "C++ Version Compatibility Guidelines",
    "C++ Standard Library Usage Rules",
    "C++ Secure Coding Standards",
    "C++ Refactoring Best Practices",
    "C++ Code Style Consistency Rules",
    "C++ Dependency Management Guidelines",
    "C++ Project Structure Standards"
)

# Create files
for ($i = 0; $i -lt $cppTopics.Length; $i++) {
    $topic = $cppTopics[$i]
    $fileName = "cpp\cpp-" + ($i+1) + "-" + ($topic -replace '\s+', '-') + ".md"
    $content = "---
title: \"$topic\"
description: \"Detailed guide for $topic in C++ development\"
publishDate: 2026-01-29
language: zh-CN
tags:
  - C++
  - Coding Standards
  - Code Style
---

# $topic

This document details $topic in C++ development to help developers write more standardized and maintainable C++ code.

## Basic Standards

### Core Principles

- Maintain consistent code style
- Improve code readability
- Reduce potential errors
- Facilitate team collaboration

### Specific Requirements

## Code Examples

```cpp
// Example code
```

## Best Practices

1. Always follow the existing code style of the project
2. Use tools to automatically check code style (like clang-format)
3. Conduct regular code reviews to ensure standard compliance

## Common Errors

- Error example 1
- Error example 2
- Error example 3

## Summary

Following $topic helps improve code quality, reduce errors, and facilitate team collaboration and code maintenance."
    
    Write-Output "Creating file: $fileName"
    Set-Content -Path "src\content\blog\$fileName" -Value $content -Force
}

Write-Output "Successfully created $($cppTopics.Length) C++ standard files!"
