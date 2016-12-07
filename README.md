# Shirewark: Network Visualizer

## Overview
This project consists of three seperate sections, a client packnet sniffer, a 3rd party AWS server, and a web-based user interface visualizer.

##CLIENT APPLICATION (Located in SharpPcapTest-master)

###BEFORE COMPILING
Install WinPcap at http://www.winpcap.org/ on a Windows machine

Install TCPDUMP/LIBPCAP at http://www.tcpdump.org/ on a Linux machine

Currently not intended to work on Mac.

###Compilation Instructions:

###Running the program:

Run SharpPcapTest-master/SharpPcapTest/bin/Debug/SharpPcapTest.exe

Console menu should open, listing the available network network adapters available. Select the network adapter you would like the program to watch and report data on.


##SERVER APPLICATION (Located on Amazon Web Services)
Server is already configured.

Information on the HTTP methods that are accepted can be found in the "TestAPI" in AWS API Gateway.

Information on the Lamda function that is run can be found in "TestGetSQL" function in AWS Lambda (code uploaded to AWS-Lambda/handler.py in this repository).

Information on the MySQL database can be viewed on the "testdb" database instance in AWS RDS.

## VISUALIZER APPLICATION (Located in [ShireWark/app/index.html](ShireWark/app/index.html))

To launch the visualizer application simply navigate to the app directory and open the index.html in a modern browser (Tested in Google Chrome). 

To start gathering real-time network information click the Start button and watch the network update in real-time. The various options near the start button can be selected while the script is running. Additionaly, the graph can be zoomed in and dragged around with the mouse.

The source code for the visualizer, with comments, can be found in [here](ShireWark/app/scripts/visualizer.js).
