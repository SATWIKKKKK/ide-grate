use zed_extension_api as zed;

struct CadenceExtension;

impl zed::Extension for CadenceExtension {
    fn new() -> Self {
        Self
    }
}

zed::register_extension!(CadenceExtension);
