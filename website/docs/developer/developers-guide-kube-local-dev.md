---
title: Kubernetes Features in Local Development
sidebar_label: Kube Features
---

Some Stratos Kubernetes features depend on additional configuration and external requirements. In order to run these in a local development 
environment see the instructions below.


## Enabling the Kubernetes Terminal in local development

You need a Kubernetes cluster with `kubectl` set up and configured with the kubeconfig file.

Run the script `build/tools/kube-terminal-dev.sh`

This script will:

- Create a service account named `stratos`
- Create a namespace named `stratos-dev`
- Write environment variables to the `src/jetstream/config.properties` file

If you have minikube running, the configuration for your Kubernetes API Server will be set correctly - otherwise
you will need to edit the `src/jetstream/config.properties` file and set these two variables:

- `KUBERNETES_SERVICE_HOST`
- `KUBERNETES_SERVICE_PORT`

The Jetstream backend should be configured.

:::note
Ensure you set `ENABLE_TECH_PREVIEW=true` to enable the this feature.
:::


## Enabling Security Obvervability Analyzers in local development

You need to build the docker image for the analyzers container.

```
cd src/jetstream/plugins/analysis/container
docker build . -t stratos-analyzers
```

Now run this container - this will provide the analysis engines to Stratos:

`docker run -d -p 8090:8090 stratos-analyzers`

Edit your Jetstream `config.properties` file and add the following lines:

```
ANALYSIS_SERVICES_API=http://127.0.0.1:8090
```

:::note
Ensure you set `ENABLE_TECH_PREVIEW=true` to enable the this feature.
:::