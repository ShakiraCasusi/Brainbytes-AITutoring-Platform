# Frontend Telemetry Dashboard Demo Guide & Walkthrough

This guide details how to utilize the custom system monitoring interface to evaluate and optimize the performance metrics implemented.

## 1. Navigating to the Interface
* Launch the application and look at the left sidebar menu navigation links.
* Click the new **Telemetry** option (graph node indicator icon) to pull up the system monitoring dashboards.

## 2. Interactive Controls & Validation Procedures
* **Model Filtering Engine**: Toggle the model dropdown menu selection from *All Models* to *GPT-4 Core* or *Claude 3 Core*. The stat cards and Recharts distribution matrix blocks will immediately adjust parameters to view isolated model trends.
* **Custom Time Range Selector**: Swap relative intervals (*Last 15 Minutes*, *Last 1 Hour*) to evaluate localized metric updates.
* **Layered Annotation Toggles**: Click the *Show/Hide Annotations* switch to trigger custom reference overlay parameters indicating critical infrastructure events.

## 3. Visual Alarms & Threshold Mapping
* **Nominal Threshold (Green)**: The *API Route Latency* card indicates optimal conditions under safe boundaries.
* **Warning Threshold (Yellow)**: The *Active Error Analysis* tracker flags moderate exceptions requiring review.
* **Critical Threshold (Red & Bar Gauges)**: The *LLM Token Quota Left* indicator uses horizontal resource usage gauges to show when compute limits require optimization.
