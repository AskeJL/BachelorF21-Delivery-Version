"""
Measure one-way packet latencies using a hardware timer (here implemented as a
counter) accessible from both the client and the server.
"""

import measurement
import socket
import time

class OneWayMeasurement(measurement.Measurement):

    description = """Measure one-way UDP packet latency time.
On your server host, run:
    $ ./quack.py --server
On your client host(s), run:
    $ ./quack.py --client <IP address of server host>
(If starting more than one client, start them at the same time.)
quack.py on your server host will spit out one file for each client containing
the latencies of each packet received from the corresponding client.
"""

    @classmethod
    def run_client(cls, target_address, n_packets, payload_len,
            send_rate_kbytes_per_s):
        cls.send_packets(target_address, n_packets, payload_len, send_rate_kbytes_per_s)

    @classmethod
    def pre_send(cls, n_packets, sock_out):
        """
        Let the server know how many packets to expect
        """
        host_id = cls.guess_host_id()
        sock_out.sendall(("%d %d" % (host_id, n_packets)).encode())

    @classmethod
    def get_packet_payload(cls, packet_n):
        """
        Return a packet payload consisting of:
        - The packet number
        - The current counter value
        - A host 'ID' representing this client specifically
          (so that received packets can later be separated)
        """
        host_id = cls.guess_host_id()
        counter_value_send = time.time()
        counter_value_send *= 1000000 
        payload = "%05d %d %d" % (packet_n, counter_value_send, host_id)
        return payload

    @staticmethod
    def guess_host_id():
        """
        Try and come up with a suitable host ID by looking at the hostname.
        e.g. hostname raspberrypi2 => host ID = '2'
        """
        hostname = socket.gethostname()
        host_id = 1
        return host_id
    # server for binding to multicast address:
    # def run_server(self, server_listen_port, recv_buffer_size):
    #     """
    #     Receive packets sent from the client. Calculate the latency for each
    #     packet by comparing the counter value from the packet (the counter value
    #     at time of transmission) to the current counter value.
    #     """
    #     MCAST_GRP = '239.0.15.1'
    #     MCAST_PORT = 5700
    #     sock_in = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    #     try:
    #       sock_in.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    #     except AttributeError:
    #       pass
    #     sock_in.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 32)
    #     sock_in.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_LOOP, 1)

    #     sock_in.bind((MCAST_GRP, MCAST_PORT))
    #     host = "172.17.0.21"
    #     sock_in.setsockopt(socket.SOL_IP, socket.IP_MULTICAST_IF, socket.inet_aton(host))
    #     sock_in.setsockopt(socket.SOL_IP, socket.IP_ADD_MEMBERSHIP,
    #                     socket.inet_aton(MCAST_GRP) + socket.inet_aton(host))

    #     print("UDP server running...")
    def run_server(self, server_listen_port, recv_buffer_size):
        """
        Receive packets sent from the client. Calculate the latency for each
        packet by comparing the counter value from the packet (the counter value
        at time of transmission) to the current counter value.
        """
        sock_in = \
            socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock_in.bind(("239.0.15.1", server_listen_port))

        print("UDP server running...")

        all_hosts_expected_n_packets = {}
        packet_n_latency_tuples = {}

        first_packet = True

        try:
            while not self.all_clients_all_packets_received(packet_n_latency_tuples, all_hosts_expected_n_packets):
                data = sock_in.recv(recv_buffer_size)
                if not data:
                    break
                data = data.decode()

                if first_packet:
                    timeout_seconds = 15
                    sock_in.settimeout(timeout_seconds)
                first_packet = False

                if len(data) < 128:
                    (host_id, expected_n_packets) = [int(x) for x in data.split(' ')]
                    print("Expecting %d packets from host %d" % (expected_n_packets, host_id))
                    packet_n_latency_tuples[host_id] = []
                    all_hosts_expected_n_packets[host_id] = expected_n_packets
                else:
                    counter_value_recv = time.time()
                    counter_value_recv *= 1000000
                    payload = data.rstrip('a')
                    (packet_n, counter_value_send, host_id) = \
                        [int(x) for x in payload.split(' ')]

                    delta = (counter_value_recv - counter_value_send)
                    latency_us = delta
                    packet_n_latency_tuples[host_id].append((packet_n, delta))
        except socket.timeout:
            print("Note: timed out waiting to receive packets")

        sock_in.close()

        for host_id in packet_n_latency_tuples.keys():
            print("Received %d packets from host %d" % (len(packet_n_latency_tuples[host_id]), host_id))

        for host_id in packet_n_latency_tuples.keys():
            host_filename = self.test_output_filename + '_' + str(host_id)
            self.save_packet_latencies(packet_n_latency_tuples[host_id], all_hosts_expected_n_packets[host_id], host_filename)


    @staticmethod
    def all_clients_all_packets_received(packets, expected_n_packets):
        """
        Decide whether or not we've received all the packets we're expecting
        from all of the hosts that are sending packets.
        """
        if len(packets) == 0:
            return False

        all_received = True
        for host_id in packets:
            if len(packets[host_id]) != expected_n_packets[host_id]:
                all_received = False
        return all_received
