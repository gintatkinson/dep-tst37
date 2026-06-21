---
title: "Alternate Reference System Simulation"
type: "user-story"
spec_source: "RFC 9179 Section 6"
issue_id: 7
---

# User Story: Alternate Reference System Simulation

## Domain Object Mapping
- **Primary Domain Objects:** `ReferenceFrame`, `GeodeticSystem`
- **Actor/Role:** `userActor : UserActor`

## BDD Scenario (OOA/OOD Realization)
**Given** a Netconf Client session and the device supports the alternate-systems feature
**When** the client configures alternate-system to "virtual-reality-frame" and astronomical-body to "mars"
**Then** the system applies the alternate reference frame and updates coordinates according to the simulation datum

## UML Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor userActor as "userActor : UserActor"
    participant referenceFrame as "referenceFrame : ReferenceFrame"
    participant geodeticSystem as "geodeticSystem : GeodeticSystem"

    userActor->>referenceFrame: configureAlternateSystem(altSys : String, body : String)
    alt [alternateSystemsSupported == true]
        referenceFrame->>geodeticSystem: applyDatumOverride(datum : String)
        geodeticSystem-->referenceFrame: success : Boolean
        referenceFrame-->userActor: status : Status
    else [alternateSystemsSupported == false]
        referenceFrame-->userActor: status : Status
    end
```

## UML State Machine Diagram
```mermaid
stateDiagram-v2
    [*] --> StandardSystemActive
    StandardSystemActive --> AlternateSystemActive : configureAlternateSystem [alternateSystemsSupported == true] / applyDatumOverride
    AlternateSystemActive --> StandardSystemActive : configureAlternateSystem [alternateSystemsSupported == false] / restoreStandardDatum
```

## Operational Context
"The system in which the astronomical body and geodetic-datum is defined.  Normally, this value is not present and the system is the natural universe; however, when present, this value allows for specifying alternate systems (e.g., virtual realities).  An alternate-system modifies the definition (but not the type) of the other values in the reference frame."

## Required Features Matrix
- [ ] #1 - [Reference Frame Configuration](https://github.com/gintatkinson/dep-tst37/blob/main/docs/features/feat-01-reference-frame.md) (Defines alternate-system and astronomical-body attributes)

## Source References
Structural Schema: [ietf-geo-location@2022-02-11.yang](file:///Users/perkunas/jail/dep-tst37/schema/ietf-geo-location@2022-02-11.yang)
Normative Specification: [RFC 9179](https://datatracker.ietf.org/doc/rfc9179/)
