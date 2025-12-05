import { parseCidr } from "cidr-tools";

export interface Site {
    name: string;
    description?: string;
    include?: string[];
    tag: string[];
    cidr?: string[];
    domain?: string[];
}

export interface Rule {
    toString(): string;
    toClashRule(): string;
}

export class CIDR implements Rule {
    private readonly _version: 4 | 6;

    get version(): 4 | 6 {
        return this._version;
    }

    private readonly _value: string;

    get value(): string {
        return this.value;
    }

    constructor(value: string, version?: 4 | 6) {
        if (version === undefined) {
            const c = parseCidr(value);
            version = c.version;
        }

        this._version = version;
        this._value = value;
    }

    static fromString(s: string): CIDR {
        return new CIDR(s);
    }

    toString(): string {
        return this._value;
    }

    toClashRule(): string {
        switch (this._version) {
            case 4:
                return `IP-CIDR,${this._value}`;
            case 6:
                return `IP-CIDR6,${this._value}`;
        }
    }
}

export class Domain implements Rule {
    private readonly _type: "Self" | "Suffix" | "SelfAndSuffix";

    get type(): "Self" | "Suffix" | "SelfAndSuffix" {
        return this._type;
    }

    private readonly _value: string;

    get value(): string {
        return this._value;
    }

    constructor(value: string, type: "Self" | "Suffix" | "SelfAndSuffix" = "SelfAndSuffix") {
        this._type = type;
        this._value = value;
    }

    static fromString(s: string): Domain {
        if (s.startsWith("*.")) {
            return new Domain(s.slice(2), "Suffix");
        } else if (s.startsWith(".")) {
            return new Domain(s.slice(1), "SelfAndSuffix");
        } else {
            return new Domain(s, "Self");
        }
    }

    toString(): string {
        switch (this._type) {
            case "Self":
                return `${this._value}`;
            case "Suffix":
                return `*.${this._value}`;
            case "SelfAndSuffix":
                return `.${this._value}`;
        }
    }

    toClashRule(): string {
        switch (this._type) {
            case "Self":
                return `DOMAIN,${this._value}`;
            case "Suffix":
                return `AND,(NOT,(DOMAIN,${this._value})),(DOMAIN-SUFFIX,${this._value})`;
            case "SelfAndSuffix":
                return `DOMAIN-SUFFIX,${this._value}`;
        }
    }
}
