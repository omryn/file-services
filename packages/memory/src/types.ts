export interface IFsMemNode {
    type: 'file' | 'dir'
    name: string
    birthtime: Date
    mtime: Date
}

export interface IFsMemFileNode extends IFsMemNode {
    type: 'file'
    contents: string
}

export interface IFsMemDirectoryNode extends IFsMemNode {
    type: 'dir'
    contents: { [nodeName: string]: IFsMemDirectoryNode | IFsMemFileNode }
}