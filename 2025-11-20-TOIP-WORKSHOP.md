# Workshop Spec-Up-T Web Editor ToIP Fifth Year Anniversary Symposium

## Who am I

My name is Kor Dwarshuis, and I am the (only) web developer on Spec-Up-T Web Editor.

## Why Spec-Up-T *Web* Editor

| Spec-Up | Spec-Up-T | Spec-Up-T Web Editor |
| :-: | :-: | :-: |
| 2020 | 2023 | Now |
| Computer Nerd | Computer Nerd | Normal people |
| Command Line | Command Line | “MS Word” |
| People who say “Directory” | People who say “Directory” | People who say “Folder” |


- For writing specifications
- For less techy people who do not like the command line:

### Command Line: No

![command-line](https://github.com/user-attachments/assets/5f7855e8-a090-425d-91ca-12f110a65173)



### Spec-Up-T Web Editor: Yes!

<video controls autoplay loop muted src="[assets/spec-up-t-web-editor.mp4](https://github.com/user-attachments/assets/00fecfa8-3943-4a6c-a95c-ddd9db0c41c4)"></video>







## Goal

My goal is that you will try **Spec-Up-T Web Editor** tomorrow

## **Spec-Up-T Web Editor** is under development

- It's working, but…
- Be careful
- Create GitHub issues

![Help](assets/help.jpg)


## How to authenticate

Use a  Personal Access Token (PAT). This token is tied to your GitHub user account. That is why you do not have to enter a username. You can delete the token at any time and create a new one.

## Spec-Up-T structure

### Collection of files

- Collection of files
- “Multiple Word documents”
- Written in **markdown** language.

### File structure

How is Spec-Up(-T) organised:

#### Files and folders (for completeness)

If you use ***Spec-Up-T Web Editor*** you'll never see this anyway:

```
/
├─ .env.example
├─ .git
├─ .github
├─ .gitignore
├─ .npmrc
├─ assets
├─ docs    <========================
├─ node_modules
├─ package-lock.json
├─ package.json
├─ README.md
├─ spec    <========================
├─ specs.json    <==================
└─ static
```

#### Relevant for you

| ❶ `spec` folder | ❷ `specs.json` file | ❸ `docs` folder |
| :-: | :-: | :-: |
| Input | Computer Instructions | Output |
| Files with markdown text | How you want it | Web page |
| Where you are writing | Where you do your settings | What people read |

`spec`: markdown files containing specification text and terms and definitions
`specs.json`: configuration file with instructions on how to do it,
`docs`: `index.html` containing the processed markdown files, stitched together in one file


| ❶ `spec` folder | ❷ `specs.json` file | 
| :- | :- |
|  `file with some text`| `web page` |
|  `file with a term and definition`||
|  `file with a term and definition`||
|  `file with some text`| `fsdgsdf` ||

<table>
<tbody>
<tr>
<td>IN</td>
<td rowspan="6">
<pre><code>┏━━━━┓
┃ &gt;_ ┃
┗━━━━┛</code></pre>
</td>
<td>OUT</td>
</tr>
<tr>
<td>File with some text</td>
<td rowspan="5">Web page</td>
</tr>
<tr>
<td>File with a term and definition</td>
</tr>
<tr>
<td>File with a term and definition</td>
</tr>
<tr>
<td>Etcetera </td>
</tr>
<tr>
<td>File with some text</td>
</tr>
</tbody>
</table>

## Let's have a look at the **Spec-Up-T Web Editor**

=============
=============


presentation GitHubUi

- logging in
- token validation
- open a repo
- explorer: reorder terms
- modifying a term
- saving (commiting) a term
- running health check / check URLs
- doing a preview
- Configure local config
- Configure external repo's (via custom, json, reference sets)

