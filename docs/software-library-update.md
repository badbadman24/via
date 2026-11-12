# Software Library Update
## @ironshieldph/via — Supply Chain Security and Cyber Exercise Enhancement

### 1. Purpose

This submission proposes security and operational improvements to the VIA software library, an Express request/response logging middleware package.

The update introduces automated dependency security checks and dependency maintenance monitoring while providing an owner-controlled example for displaying an authorized cyber exercise notice.

### 2. Supply Chain Security Enhancements

The repository includes the following security configurations:

| Component | Security Function |
|---|---|
| package-lock.json | Records dependency versions and integrity hashes |
| npm ci | Installs dependencies using the committed lockfile |
| npm audit | Checks dependencies against known vulnerability advisories |
| GitHub Actions | Automates dependency auditing, linting, and testing |
| Dependabot | Monitors npm dependencies and GitHub Actions for updates |

### 3. Automated Security Workflow

The GitHub Actions workflow is located at:

`.github/workflows/supply-chain-security.yml`

The workflow performs:

1. Source checkout.
2. Node.js environment setup.
3. Locked dependency installation.
4. npm vulnerability auditing.
5. Source syntax validation.
6. Automated test execution.

The workflow is configured to run on pull requests, pushes to the main branch, and manual dispatch.

### 4. Dependency Maintenance

The Dependabot configuration is located at:

`.github/dependabot.yml`

It monitors npm dependencies and GitHub Actions dependencies on a weekly schedule and can propose updates through pull requests.

All proposed updates should undergo review and automated testing before merging.

### 5. Validation Results

Initial local validation produced the following results:

| Validation | Result |
|---|---|
| Locked package entries with integrity fields | 91 of 91 |
| npm audit | 0 vulnerabilities |
| Source lint | Passed |
| Automated tests | 10 passed, 0 failed |
| Git whitespace validation | Passed |

These results represent the local validation performed during development. Successful execution of the GitHub Actions workflow remains subject to repository configuration and CI execution.

### 6. DCO HUNT TEAM Cyber Exercise Notice

As a separate application-level exercise enhancement, the following simulated notice is proposed for an authorized exercise environment:

**WEBSITE SEIZED — DCO HUNT TEAM**

**APT GHOSTFIRE CYBER EXERCISE**

**SIMULATED SECURITY INCIDENT**

"This website has been seized by the DCO HUNT TEAM."

Authorized exercise demonstration — not an actual seizure.

The notice must be integrated into the consuming application by its authorized owner. The VIA middleware itself does not modify website pages or application routes.

### 7. Activation, Deactivation, and Rollback

The example implementation uses an explicit environment setting:

`EXERCISE_NOTICE_ENABLED=true`

The application owner must approve the change, test it in a designated exercise environment, and deploy it using the established procedure.

To deactivate the notice:

`EXERCISE_NOTICE_ENABLED=false`

The application owner must verify that the original application routes and configuration remain intact.

### 8. Security and Operational Considerations

- Review dependency update proposals before merging.
- Investigate vulnerability findings before approving releases.
- Preserve dependency lockfile integrity.
- Protect repository permissions and workflow configuration.
- Do not introduce unauthorized changes to production systems.
- Maintain an approved rollback procedure.
- Clearly identify simulated exercise content.

### 9. Scope and Responsibility

This submission proposes improvements to the VIA repository and provides an integration example for a separate consuming application.

The repository maintainers retain authority over acceptance, integration, and release decisions. Any website-level exercise notice requires explicit authorization from the application owner.

The VIA middleware remains a request/response logging component.
