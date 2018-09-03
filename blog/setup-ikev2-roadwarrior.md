# Set Up an IKEv2 Roadwarrior Server With StrongSwan and Let's Encrypt

## Prerequisites
* One Ubuntu 16.06 server with latest upgrades and security patches installed.
* Basic knowledge about iptables.
* All the following commands should be run as root.

## Step 1 - Installing StrongSwan and Certbot
StrongSwan is an open-source IPSec daemon. We will also install the EAP radius plugin which utilises radius for client authentication, replacing the default certificate-based authentication. If you want simpler password authentication, you can use the EAP MSCHAPv2 plugin.

We will also need some firewall rules to route the traffic, so we also need iptables-persistent to allow the firewall rules to be persistent across reboots.

In IKEv2, servers identify themselves using certificates. Many tutorials will self-sign a certificate, but in this tutorial we will use Let's Encrypt, a free CA. To use its service, we will need certbot.

```bash
add-apt-repository ppa:certbot/certbot
apt update
apt install strongswan strongswan-plugin-eap-mschapv2 iptables-persistent certbot 
```

Replace `strongswan-plugin-eap-radius` with `strongswan-plugin-eap-mschapv2` if you don't want to use radius. If you have Apache or nginx running already, you probably want to also install `python-certbot-apache` or `python-cerbot-nginx`.

## Step 2 - Obtaining a Certificate
The next step is to use certbot to obtain a server certificate.

```bash
certbot certonly --non-interactive --agree-tos --email $EMAIL --standalone -d $HOST
```
Replace `$EMAIL` with your email address (used by Let's Encrypt) and `$HOST` with the domain name you intend to use to connect to the server. If there are webservers running already, replace `--standalone` with `--apache` or `--nginx` instead. More details about certbot can be found at [here](https://certbot.eff.org/docs/using.html#getting-certificates-and-choosing-plugins).

Then install the obtained certificate to be used by StrongSwan:

```bash
ln -f -s /etc/letsencrypt/live/$HOST/cert.pem /etc/ipsec.d/certs/cert.pem
ln -f -s /etc/letsencrypt/live/$HOST/privkey.pem /etc/ipsec.d/private/privkey.pem
ln -f -s /etc/letsencrypt/live/$HOST/chain.pem /etc/ipsec.d/cacerts/chain.pem
```

We will then need to set an AppArmor rule to allow StrongSwan to access targets of these symbolic links:

```bash
grep -Fq "/etc/letsencrypt/archive/$HOST/* r," /etc/apparmor.d/local/usr.lib.ipsec.charon || echo "/etc/letsencrypt/archive/$HOST/* r," >> /etc/apparmor.d/local/usr.lib.ipsec.charon
invoke-rc.d apparmor reload
```

## Step 3 - Configure StrongSwan
Update /etc/ipsec.conf to (replace $HOST with your host domain name):

```
config setup
    uniqueids=never

conn ikev2
    auto=add
    keyexchange=ikev2
    rekey=no
    dpdaction=clear
    left=%defaultroute
    leftid=@$HOST
    leftauth=pubkey
    leftsubnet=0.0.0.0/0
    leftcert=cert.pem
    leftsendcert=always
    right=%any
    rightauth=eap-mschapv2
    rightsourceip=10.1.1.0/24
    rightsendcert=never
    eap_identity=%any
```

Update /etc/strongswan.conf to:

```
charon {
    load_modular = yes
    duplicheck.enable = no
    compress = yes
    plugins {
            include strongswan.d/charon/*.conf
    }
    dns1 = 8.8.8.8
    dns2 = 8.8.4.4
}
include strongswan.d/*.conf
```

Update /etc/ipsec.secrets to:

```
: RSA privkey.pem
```

If you are using EAP MSCHAPv2, then put lines such as `$USER %any : EAP "$PASSWORD"` to /etc/ipsec.secrets to add users, replacing $USER and $PASSWORD.

If you are using EAP radius, then we need to further update /etc/strongswan.conf.d/charon/eap-radius.conf:

```
eap-radius {
    load = yes
    server = $RADIUS_SERVER
    secret = $RADIUS_SECRET
    # If you do not need account disable the following two lines
    accounting = yes
    accounting_requires_vip = yes
}
```

After modifying all configuration files, run `ipsec restart` to restart StrongSwan.

## Step 4 - Update iptables

We first need to allow forwarding. Uncomment `net.ipv4.ip_forward=1` in `/etc/sysctl.conf`, then execute `sysctl -p` to reload the config.

Then add iptables entries allowing forwarding:
```bash
iptables -t nat -A POSTROUTING -s 10.1.1.0/24 -o eth0 -j MASQUERADE
```

If you reject INPUT by default, add:
```bash
iptables -A INPUT -p esp -j ACCEPT
iptables -A INPUT -p udp -m udp --dport 500 -j ACCEPT
iptables -A INPUT -p udp -m udp --dport 4500 -j ACCEPT
```

If you reject FORWARD by default, add:
```
iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -s 10.1.1.0/24 -j ACCEPT
```

Then save the iptables so it persists across rebooting:
```bash
iptables-save > /etc/iptables/rule.v4
```

_(Created 26 Nov 2017, Modified 3 Sep 2018)_