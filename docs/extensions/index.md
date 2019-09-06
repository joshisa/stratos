# Index

Below you will find a number of clear definitions for terms used throughout Stratos, many that you will encounter when creating a Stratos extension.

# Entity Catalogue
The entity catalogue is a catalogue of information that describes the api endpoints that can be connected to stratos, the entities that stratos can expect to get from the endpoints, how to dispatch CRUD actions for each of the entities, how to render and favorite the entities, how to store the entities in the frontend store and describes the relations between entities.

# Entity
A single piece of json data, often from an API request.

## Example
A human entity:

```
{
  name: 'Nathan',
  hairColor: 'pink',
  age: 30
}
```

# Entity Type
The type of the entity e.g. human.

# Endpoint
An API services that can be connected to Stratos e.g. kubernetes.

# Endpoint Type
The unique type of the endpoint.

# Entity Key
A unique key to be used to identify the entity - this will always be a combination of the entity type and the endpoint type.

# Store
The store is a store of data that drive the frontend. Entities that are fetched will be stored in the store along with the request information and any pagination information.

# Entity Request Information
Represents the current status of the entity request. The request information is stored and can be observed via an entity monitor or entity service.

# Entity Monitor
An entity monitor is a service that can be used to get the data for and status of a single entity in the store.

# Pagination Request Information
Pagination request information is located in the store. Pagination request infomation includes; list request information, entity key and list of entities in the list.

# Entity Request Action
This is an action that is used to trigger a request to fetch, update or delete an entity.

# Action Builder
An action builder is used to create an action for a given entity.

# Action Orchestrator
An action orchestrator is used to create and dispatch an action for a given entity. A single action orchestrator can be found on a catalogue entity and can be used to dispatch any action created in the catalogue entities action builder.

# Schema
This is used to describe the entities data structure as well as any entities that are inline. Schemas allows stratos to normalise and store the data in the store.