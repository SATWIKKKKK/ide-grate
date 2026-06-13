plugins {
    kotlin("jvm") version "1.9.25"
    id("org.jetbrains.intellij") version "1.17.4"
}

group = "app.cadence"
version = "0.1.0"

repositories {
    mavenCentral()
}

intellij {
    version.set("2024.1")
    type.set("IC")
    plugins.set(listOf())
}

kotlin {
    jvmToolchain(17)
}

tasks {
    patchPluginXml {
        sinceBuild.set("241")
        untilBuild.set("253.*")
    }
}
