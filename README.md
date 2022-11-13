# Sharp Snippets

Visual Studio Code snippet extension for C# language to create [ class | interface | enum | struct ] with namespace auto-completion.

## Features

- Support file-scoped namespace
- Ability to use file-scoped namespace or old style namespace based on user setting and language support by checking csproj target framework and language version
- Detected namespace by reading csproj file and check for RootNamespace property and if not exists then use csproj filename
- Normalize filename to class name by converting it to pascal case and replace each space, dot with underscore


## Roadmap
- [x] option to use old style namespace
- [x] auto detect file-scoped namespace support from csharp language version
- [ ] custom snippet label via settings
- [ ] namespace module auto complete

## See how it works
  
![Example](images/example.gif)



