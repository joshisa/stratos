# Entity Catalogue

The entity catalogue is the backbone of the stratos application and is an integrate part of any extension. The entities described in the entity catalogue dictate to stratos, amongst other things, how to fetch and modify an entity via a web api, how to render an entity and where important metadata can be found within an entity.

Note: A list of further terms can be found in our [glossary](./glossary.md).

To further help understand how stratos uses the entity catalogue we have outlined a user case below.

## Example Use Case

### Extension Name

The Pet Database

### Extension Description

The pet database is a database used by vets to track pets, their owners and any previous vets the pet may have visited. The Pet Database has a web API that is used by various applications. This simple Web API allows you to:

* View a single pet and see their name, chip id, animal type, breed, notes left by other vets, current owner, current vets and a list of their previous vets.
* Update the name and add notes to a single pet.
* Remove a pet from the vet.

## The Pet Database entities

The first part of the process when creating a Stratos extension is to identity all of the entities provided by the API. The entities identified for the The Pet Database are as followed:

1) Pet
2) Vet
3) Owner

The next step is to 
