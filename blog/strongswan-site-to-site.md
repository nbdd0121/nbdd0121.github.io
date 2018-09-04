# Set Up Route-based Site-to-Site VPN with StrongSwan

By default IKEv2 is policy-based, which means the traffic is transformed at the interface. This is less flexible compared to traditional tunnel interfaces, which are route-based.

There are two common ways of creating route-based site-to-site VPN. One way is to create a host-to-host VPN connection, and then run GRE over it. Another way is to create a site-to-site VPN with VTI (virtual tunnel interface) which allows us to use a policy-based tunnel as a route-based one by utilising firewall marks.

The GRE method is a layer 2 method, while VTI is a layer 3 method. This tutorial will be using VTI.

## Prerequisites
* Two Ubuntu servers with StrongSwan and certificate configured already.
* All the following commands should be run as root.

## Setup 1 - Configure StrongSwan
In the following setup, we will connect servers foo.example.com and bar.example.com with IP ranges on each side be 10.1.0.0/16 and 10.2.0.0/16.

On server foo, add the following to /etc/ipsec.conf:

```
conn bar
    auto=route
    keyexchange=ikev2
    mobike=no
    reauth=no
    dpdaction=clear
    mark=1
    left=%defaultroute
    leftid=@foo.example.com
    leftcert=cert.pem
    leftsubnet=0.0.0.0/0,::/0
    right=bar.example.com
    rightid=@bar.example.com
    rightsubnet=0.0.0.0/0,::/0
```

You may want to change the firewall mark used to avoid conflicts.

Add the following to /etc/strongswan.conf:
```
    install_routes = no
    install_virtual_ip = no
```

This will allow us to manage routes and IP addresses manually.

Update /etc/strongswan.d/charon/farp.conf, and change `load=yes` to `load=no`. The farp plugin by default will proxy arp requests to right-side virtual IPs, but somehow it is implemented in a way that it also proxies right-side subnets. So if it is not disabled, it will ruin the whole broadcast domain if the connection is up.

Make sure the root CA cert of another server is placed in /etc/ipsec.d/cacerts. For example, if your certificate is obtained from Let's Encrypt, run `ln -s /etc/ssl/certs/DST_Root_CA_X3.pem /etc/ipsec.d/cacerts/`.

If the server also hosts a roadwarrior server, you'd better setup VTI for that connection as well, as we disabled all routes and virtual IP installation for all StrongSwan-managed connections.

I use the following configuration for roadwarrior in /etc/ipsec.conf:
```
    mark=2
    rightsourceip=10.1.1.2-10.1.1.254
```

Configure server bar similarly, remembering to change address spaces and names.

After modifying all configuration files, run `ipsec restart` to restart StrongSwan. You will be able to connect, but as we haven't configure the interfaces you will not be able to send/receive packets at the moment.

## Step 2 - Configure Interfaces

On server foo, create /etc/network/interfaces.d/100-tun.cfg with the following contents:
```
auto vti-bar
iface vti-bar inet static
        address 10.1.1.1
        pointopoint 10.2.1.1
        mtu 1400
        pre-up ip tunnel add vti-bar mode vti remote <IP of bar> local <IP of foo> key 1
        post-up sysctl -w net.ipv4.conf.vti-bar.disable_policy=1
        post-up sysctl -w net.ipv4.conf.vti-bar.rp_filter=0
        post-up ip route add 10.2.0.0/16 dev vti-bar
        post-down ip tunnel del vti-bar
```

If you also want IPv6, you can set up routes and addresses here as well.

If it is used as roadwarrior, put
```
auto vti-lan
iface vti-lan inet static
    address 10.1.1.1
    netmask 255.255.255.0
    mtu 1400
    pre-up ip tunnel add vti-lan mode vti remote 0.0.0.0 local <IP of foo> key 2
    post-up sysctl -w net.ipv4.conf.vti-lan.disable_policy=1
    post-up sysctl -w net.ipv4.conf.vti-lan.rp_filter=0
    post-down ip tunnel del vti-lan
```

Run `ifup vti-bar` and `ifup vti-lan` to bring up the interfaces. Do similarly on server bar, then you should be able to use the interfaces.

_(Created 30 Jun 2018, Modified 4 Sep 2018)_
