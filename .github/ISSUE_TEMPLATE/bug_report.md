name: Bug Report
description: Create a report to help us find and fix defects.
labels: [bug]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of the bug.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to recreate the issue.
      placeholder: |
        1. Go to dashboard
        2. Click ...
        3. See error
    validations:
      required: true
